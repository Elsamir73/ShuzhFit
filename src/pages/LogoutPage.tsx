import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../lib/auth";

export function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void logoutUser().finally(() => navigate("/login", { replace: true }));
  }, [navigate]);

  return null;
}
