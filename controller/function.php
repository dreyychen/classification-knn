<?php
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