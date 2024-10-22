import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HomeRoute } from "./home";
import { ResultRoute } from "./result";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRoute />,
  },
  {
    path: "/result",
    element: <ResultRoute />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
