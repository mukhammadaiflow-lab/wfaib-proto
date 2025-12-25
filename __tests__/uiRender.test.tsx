import { render, screen } from "@testing-library/react";
import LoginPage from "@/pages/login";

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

test("basic UI render: login page", () => {
  render(<LoginPage />);
  expect(screen.getByText("Sign in (stub)")).toBeInTheDocument();
});

