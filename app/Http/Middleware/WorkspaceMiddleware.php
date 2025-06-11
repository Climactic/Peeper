<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;
use Symfony\Component\HttpFoundation\Response;

class WorkspaceMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();

            // Check if we're switching workspaces
            if (config('workspace.enabled') && $request->has('switch_workspace') && $request->input('switch_workspace')) {
                $workspaceId = $request->input('switch_workspace');

                // Verify user belongs to this workspace
                $workspaceBelongsToUser = $user->workspaceMemberships()
                    ->where('workspace_memberships.workspace_id', $workspaceId)
                    ->exists();

                if ($workspaceBelongsToUser) {
                    $user->current_workspace_id = $workspaceId;
                    $user->save();
                }
            }

            // Set the current workspace context if user has a current workspace
            if ($user->current_workspace_id) {
                Context::add('workspace_id', $user->current_workspace_id);
            }
        }

        return $next($request);
    }
}
