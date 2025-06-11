<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

trait HasUlid
{
    use HasUlids;

    public function uniqueIds()
    {
        return [
            'id',
        ];
    }
}
