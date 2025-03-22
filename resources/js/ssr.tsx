import { createInertiaApp } from "@inertiajs/react";
import createServer from "@inertiajs/react/server";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import ReactDOMServer from "react-dom/server";
import { Config, type RouteName, RouteParams, route } from "ziggy-js";
import { SharedData } from "./types";

const appName = import.meta.env.VITE_APP_NAME || "Peeper";

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => `${title} - ${appName}`,
        resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob("./pages/**/*.tsx")),
        setup: ({ App, props }) => {
            global.route = (name: RouteName, params?: RouteParams<RouteName>, absolute?: boolean, config?: Config) =>
                route(name, params, absolute, {
                    ...config,
                    ...(page.props.ziggy as SharedData["ziggy"]),
                    location: new URL((page.props.ziggy as SharedData["ziggy"]).location),
                });
            return <App {...props} />;
        },
    }),
);
