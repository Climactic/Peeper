<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Context;

trait HasTeamScope
{
    public static function bootHasTeamScope(): void
    {
        static::addGlobalScope('team', function (Builder $builder) {
            if ($teamId = Context::get('team_id')) {
                $builder->where('team_id', $teamId);
            }
        });

        static::creating(function (Model $model) {
            if ($teamId = Context::get('team_id')) {
                $model->team_id ??= $teamId;
            }
        });
    }
}
