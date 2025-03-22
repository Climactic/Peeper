import type { Config, RouteName, RouteParams } from "ziggy-js";

declare global {
    function route(name: RouteName, params?: RouteParams<string>, absolute?: boolean, config?: Config);
}
