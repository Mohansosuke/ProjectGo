import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/auth/verify/${token}`
                );

                setMessage(res.data.message || "Email verified successfully!");

                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            } catch (err) {
                setMessage(
                    err.response?.data?.message || "Verification failed."
                );
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "22px",
                fontWeight: "600",
            }}
        >
            {message}
        </div>
    );
};

export default VerifyEmail;