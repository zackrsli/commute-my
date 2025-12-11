import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/line/:id", "routes/line.tsx"),
    route("/search", "routes/search.tsx"),
    route("/route/:index", "routes/route.$index.tsx"),
    route("/settings", "routes/settings.tsx"),
    route("/donate", "routes/donate.tsx"),
    route("/about", "routes/about.tsx"),
] satisfies RouteConfig;
