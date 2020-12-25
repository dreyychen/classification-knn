$(document).ready(() => {
    step1();
})

function step1() {
    $('#step-1-form').submit((e) => {
        e.preventDefault()

        $("#loading-text").text("Reading Data")
        $("#loading").show()

        var formData = new FormData(e.target)
        $.ajax({
            url: './controller/controller.php',
            data: formData,
            success: (response) => {
                $("#loading").hide()

                final_data = response

                // reset table
                resetTable()

                // show train data
                showResponse("#train-table", response, "train")

                // show test data
                showResponse("#test-table", response, "test")

                $('#step-2').show(0, step2)
                $('#loaded-data').show(0)
                $('#step-1').hide(0)
                $(window).trigger('resize');
            },
            error: () => {
                $("#loading").hide()
            },
            dataType: 'json',
            processData: false,
            contentType: false,
            method: 'POST'
        })
    })
}

function step2() {
    const map_value = $("#mapping-value")
    const header = Object.keys(final_data["train"][0])
    map_value.find(".form-check").remove()
    header.forEach((v) => {
        map_value.append(`
        <li class="form-check">
            <input class="form-check-input" checked type="checkbox" value="${v}" id="${v}">
            <label class="form-check-label" for="${v}">${v}</label>
        </li>`)
    })

    $('#save-attribute-button').click((e) => {
        $("#loading-text").text("Saving Attributes")
        $("#loading").show()

        let attributes = []
        let children = map_value.children()
        for (let i = 0; i < children.length; i++) {
            let val = children.get(i).firstElementChild.value
            let checked = children.get(i).firstElementChild.checked
            attributes.push({
                "val": val,
                "checked": checked
            })
        }

        $.ajax({
            url: './controller/controller.php',
            data: {
                "request_data": final_data,
                "attr": attributes,
                "step": "2"
            },
            success: (response) => {
                $("#loading").hide()
                final_data = response;
                // reset table
                resetTable()

                // show train data
                showResponse("#train-table", final_data, "train")

                // show test data
                showResponse("#test-table", final_data, "test")

                $('#step-3').show(0, step3)
                $('#step-2').hide(0)
            },
            error: () => {
                $("#loading").hide()
            },
            method: "POST",
            dataType: "json"
        })
    })
}

function step3() {
    const sel_label = $("#select-label")
    const header = Object.keys(final_data["train"][0])
    sel_label.find(".sel-label-div").remove()
    header.forEach((v) => {
        sel_label.append(`
        <li class="form-check">
            <input class="form-check-input" type="radio" name="label-radio" id="${v}-label" value="${v}">
            <label class="form-check-label" for="${v}-label">${v}</label>
        </li>`)
    })

    $('#save-label-button').click((e) => {
        const k = $("#k-count").val()
        $("#loading-text").text("Setting Label")
        $("#loading").show()

        let children = sel_label.children()
        for (let i = 0; i < children.length; i++) {
            let val = children.get(i).firstElementChild.value
            let checked = children.get(i).firstElementChild.checked
            if (checked == true) {
                label = val;
            }
        }

        $.ajax({
            url: './controller/controller.php',
            data: {
                "request_data": final_data,
                "label": label,
                "step": "3"
            },
            success: (response) => {
                final_data_exclude_label = response;
                step4(k);
            },
            error: () => {
                $("#loading").hide()
            },
            method: "POST",
            dataType: "json"
        })
    })
}

function step4(k) {
    console.log(k);
    $("#loading-text").text("Parsing Nominal Data to Numeric")

    $.ajax({
        url: './controller/controller.php',
        data: {
            "request_data": final_data_exclude_label,
            "step": "4"
        },
        success: (response) => {
            parsed_data = response
            step5(k)
        },
        error: () => {
            $("#loading").hide()
        },
        method: "POST",
        dataType: "json"
    })
}

function step5(k) {
    console.log(k);
    $("#loading-text").text("Calculating Distances")

    $.ajax({
        url: './controller/controller.php',
        data: {
            "request_data": parsed_data,
            "final_data": final_data,
            "label": label,
            "step": "5",
            "k" : k
        },
        success: (response) => {
            $("#loading").hide()
            final_data = response["data"]
            final_k = response["k"]

            $("#result-k").text("K = " + final_k)
            // console.log(response)

            // reset table
            resetTable()

            // show train data
            showResponse("#train-table", final_data, "train")

            // show test data
            showResponse("#test-table", final_data, "test")

            $('#result-chart').show(0, showChart)
        },
        error: () => {
            $("#loading").hide()
        },
        method: "POST",
        dataType: "json"
    })
}

function showChart() {

    $.ajax({
        url: './controller/controller.php',
        data: {
            "final_data": final_data,
            "step": "chart"
        },
        success: (response) => {
            $('#step-3').hide(0)
            new Chart(document.getElementById("bar-chart"), {
                type: 'bar',
                data: {
                    labels: ["Chronic Kidney Disease", "Not Chronic Kidney Disease"],
                    datasets: [
                        {
                            label: "Predicted People",
                            backgroundColor: ["#ff5252", "#448aff"],
                            data: [response[0], response[1]]
                        }
                    ]
                },
                options: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Predicted Chronic Kidney Disease'
                    },
                    scales: {
                        yAxes: [
                            {
                                ticks: {
                                    beginAtZero: true
                                }
                            }
                        ]
                    }
                }
            });
        },
        error: () => {

        },
        method: "POST",
        dataType: "json"
    })
}

function resetTable() {
    $("#train-data-div *").remove()
    $("#test-data-div *").remove()
    $("#train-data-div").append(`
    <table class="table table-striped table-bordered dt-responsive nowrap" id="train-table" style="width:100%">
        <thead><tr></tr></thead>
        <tbody></tbody>
    </table>`)
    $("#test-data-div").append(`
    <table class="table table-striped table-bordered dt-responsive nowrap" id="test-table" style="width:100%">
        <thead><tr></tr></thead>
        <tbody></tbody>
    </table>`)
}

function showFormData(formData) {
    for (var pair of formData.entries()) {
        console.log(pair[0], pair[1])
    }
}

function showResponse(id, response, key) {
    var table = $(id)
    const response_data = response[key]
    const header = Object.keys(response_data[0])
    header.forEach((v) => {
        table.find("thead").find("tr").append(`<th>${v}</th>`)
    })
    response_data.forEach((v) => {
        var line = `<tr>`
        for (val in v) {
            line += `<td>${v[val]}</td>`
        }
        line += `</tr>`
        table.find("tbody").append(line)
    })

    if (!$.fn.DataTable.isDataTable(table)) {
        table.DataTable({
            pageLength: 5,
            lengthMenu: [[5, 10, 20, -1], [5, 10, 20, 'All']],
            responsive: true
        })
    }
}