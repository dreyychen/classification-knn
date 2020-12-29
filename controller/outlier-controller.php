<?php
require_once "function.php";

if($_SERVER["REQUEST_METHOD"] === "POST") {
    // STEP 1
    if ($_POST["step"] === "1") {
        // get file data
        $outlier_data = $_FILES["outlier-data"];

        $data = readCSV($outlier_data);

        echo json_encode($data);
    }

    // STEP 2
    else if ($_POST["step"] === "2") {
        $data = $_POST["request_data"];
        $attr = $_POST["attr"];

        foreach ($attr as $index => $eachattribute) {
            if($eachattribute["checked"] == "false") {
                foreach ($data as $i => $x) {
                    unset($data[$i][$eachattribute["val"]]);
                }
            }
        }

        $header = array_keys($data[0]);
        $response = [
            "data" => $data,
            "header_count" => count($header)
        ];
        echo json_encode($response);
    }

    // STEP 3 
    else if ($_POST["step"] === "3") {
        $data = $_POST["request_data"];
        $raw_data = $_POST["raw_data"];
        $dt = $_POST["dt"];
        $pr = $_POST["pr"];
        $data_count = count($data);
        $absolute_count = $pr * $data_count;

        $header = array_keys($data[0]);
        $unique = [];
        foreach ($header as $index => $k) {
            // setiap headernya dicari yang unique
            if(!is_numeric($data[0][$k])) {
                $unique[$k] = getUnique($k, $data);
            }
        }
        
        // parse number
        foreach ($header as $index => $k) {
            if(!is_numeric($data[0][$k])) {  
                // parse
                foreach ($data as $i => $x) {
                    $data[$i][$k] = array_search($data[$i][$k] , $unique[$k]);
                }
            }
        }
        
        $normalized_data = normalize($data, $header);

        // calculate distance
        $distances = [];
        for($x = 0; $x < count($normalized_data); $x++) {
            $temp_distances = [];
            for($y = 0; $y < count($normalized_data); $y++) {
                $calculated_dis = calculateDistance($normalized_data, $y, $x, $header);
                $lower = ($calculated_dis <= $dt && $calculated_dis != 0) ? "yes" : "no";
                $distance = [
                    "index1" => $x,
                    "index2" => $y,
                    "distance" => $calculated_dis,
                    "lower" => $lower
                ];
                array_push($temp_distances, $distance);
            }
            array_push($distances, $temp_distances);
        }

        for ($i=0; $i < count($raw_data); $i++) {
            $raw_data[$i]["is_outlier"] = "false";
        }
        // detect outlier
        for ($i=0; $i < count($distances); $i++) {
            $lower_data = count_key($distances[$i], "lower", "yes");
            if(count($lower_data) < $absolute_count) {
                $index = $lower_data[0]["index1"];
                $raw_data[$index]["is_outlier"] = "true";
            }
        }

        $response = [
            "outlier_count" => count(count_key($raw_data, "is_outlier", "true")),
            "not_outlier_count" => count(count_key($raw_data, "is_outlier", "false")),
            "data" => $raw_data,
        ];
        
        echo json_encode($response);
    }
}


function count_key($array, $key, $condition) {
    $return = [];
    foreach ($array as $i => $v) {
        if($v[$key] === $condition) {
            array_push($return, $v);
        }
    }

    return $return;
}

function print_matrix($arr) {
    for ($i=0; $i < count($arr); $i++) { 
        for ($j=0; $j < count($arr[$i]); $j++) { 
            printf("| %.2f ", $arr[$i][$j]["distance"]);
        }
        printf("\n");
    }
}

function normalize($data, $header) {
    $newdata = [];

    foreach($header as $column) {
        $temp = [];
        foreach($data as $datum) {
            array_push($temp, $datum[$column]);
        }

        $mintemp = min($temp);
        $maxtemp = max($temp);
        
        foreach($data as $i => $datum) {
            $v = $datum[$column];
            $newdata[$i][$column] = ($v - $mintemp) / ($maxtemp - $mintemp);
        }
    }

    return $newdata;
}

function calculateDistance($data, $indexofdata1, $indexofdata2, $header) {
    $temp = 0;
    foreach ($header as $h) {
        $temp += (pow($data[$indexofdata2][$h]-$data[$indexofdata1][$h] , 2));
    }
    return sqrt($temp);
}