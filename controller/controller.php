<?php

if($_SERVER["REQUEST_METHOD"] === "POST") {
    // print_r($_POST);
    // STEP 1
    if ($_POST["step"] === "1") {
        // get file data
        $train_data_file = $_FILES["train_data"];
        $test_data_file = $_FILES["test_data"];

        $response = [];
        $response["train"] = readCSV($train_data_file);
        $response["test"] = readCSV($test_data_file);

        echo json_encode($response);
    }

    // STEP 2
    else if ($_POST["step"] === "2") {
        $data = $_POST["request_data"];
        $attr = $_POST["attr"];

        foreach ($attr as $index => $eachattribute) {
            if($eachattribute["checked"] == "false") {
                foreach ($data["train"] as $i => $x) {
                    unset($data["train"][$i][$eachattribute["val"]]);
                }
                foreach ($data["test"] as $i => $x) {
                    unset($data["test"][$i][$eachattribute["val"]]);
                }
            }
        }
        echo json_encode($data);
    }

    // STEP 3
    else if ($_POST["step"] === "3") {
        $data = $_POST["request_data"];
        $label = $_POST["label"];

        foreach ($data["train"] as $i => $x) {
            unset($data["train"][$i][$label]);
        }
        foreach ($data["test"] as $i => $x) {
            unset($data["test"][$i][$label]);
        }

        echo json_encode($data);
    }

    // STEP 4
    else if ($_POST["step"] === "4") {
        // get unique data
        $data = $_POST["request_data"];
        $header = array_keys($data["train"][0]);
        $unique = [];
        foreach ($header as $index => $k) {
            // setiap headernya dicari yang unique
            if(!is_numeric($data["train"][0][$k])) {
                $unique[$k] = getUnique($k, $data["train"]);
            }
        }
        
        // parse number
        foreach ($header as $index => $k) {
            if(!is_numeric($data["train"][0][$k])) {  
                // parse
                foreach ($data["train"] as $i => $x) {
                    $data["train"][$i][$k] = array_search($data["train"][$i][$k] , $unique[$k]);
                }
            }

            if(!is_numeric($data["test"][0][$k])) { 
                // parse 
                foreach ($data["test"] as $i => $x) {
                    $data["test"][$i][$k] = array_search($data["test"][$i][$k] , $unique[$k]);
                }
            }
        }

        echo json_encode($data);
    }

    // STEP 5
    else if ($_POST["step"] === "5") {
        
        $data = $_POST["request_data"];
        $raw_data = $_POST["final_data"];
        $label = $_POST["label"];
        $header = array_keys($data["train"][0]);
        $k_count = $_POST["k"];
        // distances isinya 
        // train => index train nya
        // test => index test nya
        // distance => distance nya
        for($x = 0; $x < count($data["test"]); $x++) {
            $distances = [];
            for($y = 0; $y < count($data["train"]); $y++) {
                $calculated_dis = calculateDistance($data["train"], $data["test"], $y, $x, $header);
                $distance = [
                    "test" => $x,
                    "train" => $y,
                    "distance" => $calculated_dis
                ];

                array_push($distances, $distance);
            }
            // sort
            usort($distances, function($a, $b){
                return $a["distance"] <=> $b["distance"];
            });

            // take 3 min distance
            // TODO: bikin k nya dilempar dari html
            if($k_count === "")
                $k_count = 3;
            else $k_count = (int)$k_count;
            $labels = [];
            $test_index = $x;
            for ($i=0; $i < $k_count; $i++) { 
                $train_index = $distances[$i]["train"];
                array_push($labels, $raw_data["train"][$train_index][$label]);
            }
            
            $arr_freq = array_count_values($labels);
            arsort($arr_freq);
            $new_arr = array_keys($arr_freq);
            $raw_data["test"][$x][$label] = $new_arr[0];
            // var_dump($label, $new_arr[0]);
            // print_r($raw_data["test"][$x]);
        }

        $response = [];
        $response["data"] = $raw_data;
        $response["k"] = $k_count;
        echo json_encode($response);
    }

    // CHART
    else if ($_POST["step"] === "chart") {
        $data = $_POST["final_data"];

        $ckd_count = 0;
        $nckd_count = 0;
        foreach ($data["test"] as $key => $value) {
            if ($value["classification"] == "ckd")
                $ckd_count++;
            else
                $nckd_count++;
        }

        $response = [];
        $response[0] = $ckd_count;
        $response[1] = $nckd_count;

        echo json_encode($response);
    }
}

function calculateDistance($train, $test, $indexoftrain, $indexoftest, $header) {
    $temp = 0;
    foreach ($header as $h) {
        $temp += (pow($test[$indexoftest][$h]-$train[$indexoftrain][$h] , 2));
    }
    return sqrt($temp);
}

function getUnique($header, $data) {
    $unique = [];
    foreach ($data as $i => $d) {
        array_push($unique, $d[$header]);
    }
    $unique = array_unique($unique);
    $reset_unique = array_values($unique);
    sort($reset_unique);
    return $reset_unique;
}

function readCSV($data_file) {
    $header = [];
    $array = [];
    if($file = fopen($data_file["tmp_name"], "r")) {
        $header = fgetcsv($file);

        $index = 0;
        while($temp_train = fgets($file)) {
            // per line
            $temp_train = explode(',',$temp_train);
            foreach ($temp_train as $key => $value) {
                // per column
                $value = trim($value);
                if($value === null || $value === "" || strlen($value) === 0 || $value === "?") {
                    array_splice($array, $index, 1);
                    $index--;
                    break;
                }

                $array[$index][$header[$key]] = $value;
            }
            $index++;
        }
        // print_r(explode(",",$array[31]["id"]));
        // print_r($array[31]);
        return $array;
    }
    return false;
}