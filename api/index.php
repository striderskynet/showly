<?php
    $filepath = "../database.json";
    
    if ( !isset ($_GET['method'] ) ) die ("No action!!");
    if (!file_exists($filepath)) touch($filepath);

    $database = json_decode(file_get_contents($filepath), true);
    if (!$database) $database = array();

    switch ( $_GET['method'] ) {
        case "create":  create($_GET); break;
        case "read":    read($_GET); break;
        case "update":  update($_GET); break;
        case "delete":  delete($_GET); break;
    }

    function searchForId($id, $array) {
        foreach ($array as $key => $val) {
            if ($val === $id) {
                return $key;
            }
        }
        return false;
    }

    function create ($args){
        global $database, $filepath;
        
        if (!searchForId($args['id'], $database)){
                $database[] = $args['id'];
                file_put_contents($filepath, json_encode($database));
        }
        echo json_encode($database, JSON_PRETTY_PRINT);
    }
    
    function read ($args){
        global $database;
        echo json_encode($database);
    }
    

    function update ($args){

    }
    

    function delete ($args){
        global $database, $filepath;
        //print_r ( $database );
        if (($key = array_search($args['id'], $database)) !== false) {
            $id = searchForId($args['id'], $database);
            $database[$id] = "";
            file_put_contents($filepath, json_encode( array_filter($database)));
        }

        $res['code'] = "OK"; $res['value'] = "The show {$args['id']} is deleted";
        echo json_encode($res, JSON_PRETTY_PRINT);
    }
    
?>