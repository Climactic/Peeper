<?php

namespace App\Listeners;

use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RegisteredEvent
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Registered $event): void
    {
        /** @var \App\Models\User $user */
        $user = $event->user;

        DB::transaction(function () use ($user) {
            $workspace = Workspace::create([
                'name' => "{$user->name}'s Workspace",
                'slug' => Str::slug("{$user->name} Workspace").Str::random(5),
                'owner_id' => $user->id,
            ]);

            WorkspaceMembership::create([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'role' => 'owner',
            ]);

            $user->forceFill(['current_workspace_id' => $workspace->id])->save();
        });
    }
}
