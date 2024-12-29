import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem("token");
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login and save the current location
        return <Navigate to="/login" state={{ from: location.pathname }} />;
    }

    return children;
};

export default ProtectedRoute;
