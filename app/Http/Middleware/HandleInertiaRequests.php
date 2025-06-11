<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'workspaces' => $this->getUserWorkspacesData($request->user()),
        ];
    }

    private function getUserWorkspacesData(?User $user): array
    {
        if (! $user) {
            return [[], null];
        }

        $memberships = $user->workspaceMemberships()
            ->with('workspace')
            ->get();

        $workspaces = $memberships->map(fn($membership) => [
            'id' => $membership->workspace->id,
            'name' => $membership->workspace->name,
            'role' => $membership->role,
            'logo' => $membership->workspace->logo,
        ])->toArray();

        $currentWorkspace = null;
        if ($user->currentWorkspace) {
            $currentMembership = $memberships->firstWhere('workspace_id', $user->currentWorkspace->id);

            $currentWorkspace = [
                'id' => $user->currentWorkspace->id,
                'name' => $user->currentWorkspace->name,
                'role' => $currentMembership ? $currentMembership->role : null,
                'logo' => $user->currentWorkspace->logo,
            ];
        }

        return [
            'enabled' => config('workspace.enabled'),
            'all' => $workspaces,
            'current' => $currentWorkspace,
        ];
    }
}
