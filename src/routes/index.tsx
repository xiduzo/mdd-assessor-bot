import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HomeRoute } from "./home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRoute />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
