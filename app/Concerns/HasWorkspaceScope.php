<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Context;

trait HasWorkspaceScope
{
    public static function bootHasWorkspaceScope(): void
    {
        static::addGlobalScope('workspace', function (Builder $builder) {
            if ($workspaceId = Context::get('workspace_id')) {
                $builder->where('workspace_id', $workspaceId);
            }
        });

        static::creating(function (Model $model) {
            if ($workspaceId = Context::get('workspace_id')) {
                $model->workspace_id ??= $workspaceId;
            }
        });
    }
}
