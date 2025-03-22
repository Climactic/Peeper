<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default PostgreSQL Queries
    |--------------------------------------------------------------------------
    |
    | These are the default queries used for common database operations.
    | They can be customized per connection if needed.
    |
    */
    'postgres' => [
        'table_data' => [
            'query' => 'SELECT * FROM :schema.:table LIMIT :limit OFFSET :offset',
            'description' => 'Get data from a table with pagination',
            'parameters' => ['schema', 'table', 'limit', 'offset', 'where'],
        ],
        'table_data_with_filter' => [
            'query' => 'SELECT * FROM :schema.:table WHERE :where LIMIT :limit OFFSET :offset',
            'description' => 'Get data from a table with filters and pagination',
            'parameters' => ['schema', 'table', 'where', 'limit', 'offset'],
        ],
        'table_count' => [
            'query' => 'SELECT COUNT(*) as count FROM :schema.:table',
            'description' => 'Count rows in a table',
            'parameters' => ['schema', 'table', 'where'],
        ],
        'table_count_with_filter' => [
            'query' => 'SELECT COUNT(*) as count FROM :schema.:table WHERE :where',
            'description' => 'Count rows in a table with filters',
            'parameters' => ['schema', 'table', 'where'],
        ],
        'insert_row' => [
            'query' => 'INSERT INTO :schema.:table (:columns) VALUES (:values)',
            'description' => 'Insert a row into a table',
            'parameters' => ['schema', 'table', 'columns', 'values'],
        ],
        'update_row' => [
            'query' => 'UPDATE :schema.:table SET :set_clause WHERE :where_clause',
            'description' => 'Update a row in a table',
            'parameters' => ['schema', 'table', 'set_clause', 'where_clause'],
        ],
        'delete_row' => [
            'query' => 'DELETE FROM :schema.:table WHERE :where_clause',
            'description' => 'Delete a row from a table',
            'parameters' => ['schema', 'table', 'where_clause'],
        ],
    ],
];
