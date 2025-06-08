<?php

return [
    'enabled' => env('WORKSPACE_ENABLED', false),

    'roles' => [
        'owner' => [
            'permissions' => ['*'],
        ],
        'admin' => [
            'permissions' => ['*'],
        ],
        'member' => [
            'permissions' => ['*'],
        ],
    ],
];
