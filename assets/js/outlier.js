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
            url: './controller/outlier-controller.php',
            data: formData,
            success: (response) => {
                $("#loading").hide()
                final_data = response
                raw_data = response

                // reset table
                resetTable()

                // show outlier data
                showResponse("#outlier-table", final_data)

                $('#step-2').show(0, step2)
                $('#step-1').hide(0)
                $('#loaded-data').show(0)
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
    const header = Object.keys(final_data[0])
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
            url: './controller/outlier-controller.php',
            data: {
                "request_data": final_data,
                "attr": attributes,
                "step": "2"
            },
            success: (response) => {
                $("#loading").hide()
                final_data = response["data"]
                attribute_count = response["header_count"]
                dt_range_max = Math.sqrt(attribute_count)

                // reset table
                resetTable()

                // show outlier data
                showResponse("#outlier-table", final_data)

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
    $('#dt-range').text('Distance threshold must be between 0 and ' + dt_range_max)
    $('#default-dt').text('Default distance threshold = ' + Math.floor(dt_range_max))
    $("#d-threshold").val(Math.floor(dt_range_max))

    $("#save-d-p-button").click((e) => {
        const dt = $("#d-threshold").val()
        const pr = $("#proportion").val()
        distance_threshold = dt
        proportion = pr
        $("#loading-text").text("Detecting Outlier")
        $("#loading").show()

        $.ajax({
            url: './controller/outlier-controller.php',
            data: {
                "request_data": final_data,
                "raw_data": raw_data,
                "dt": dt,
                "pr": pr,
                "step": "3"
            },
            success: (response) => {
                final_data = response

                // reset table
                resetTable()

                // show outlier data
                showResponse("#outlier-table", final_data["data"])

                $('#result-chart').show(0, showChart)
                $('#result-dt').text("Distance Threshold = " + distance_threshold)
                $('#result-pr').text("Proportion = " + proportion)
                $('#step-3').hide(0)
                $("#loading").hide()
            },
            error: () => {
                $("#loading").hide()
            },
            method: "POST",
            dataType: "json"
        })
    })
}

function showChart() {
    new Chart(document.getElementById("bar-chart"), {
        type: 'bar',
        data: {
            labels: ["Outlier", "Not Outlier"],
            datasets: [
                {
                    label: "Data Count",
                    backgroundColor: ["rgba(255, 99, 99, 0.2)", "rgba(54, 162, 235, 0.2)"],
                    borderColor: ["rgba(255, 99, 99)", "rgba(54, 162, 235)"],
                    borderWidth: 1,
                    data: [final_data["outlier_count"], final_data["not_outlier_count"]]
                }
            ]
        },
        options: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Outlier Detection Result'
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
}

function resetTable() {
    $("#outlier-data-div *").remove()
    $("#outlier-data-div").append(`
    <table class="table table-striped table-bordered dt-responsive nowrap" id="outlier-table" style="width:100%">
        <thead><tr></tr></thead>
        <tbody></tbody>
    </table>`)
}

function showResponse(id, response) {
    var table = $(id)
    const header = Object.keys(response[0])
    header.forEach((v) => {
        table.find("thead").find("tr").append(`<th>${v}</th>`)
    })
    response.forEach((v) => {
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