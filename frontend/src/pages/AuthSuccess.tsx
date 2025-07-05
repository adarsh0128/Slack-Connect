import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSlack } from '../contexts/SlackContext';

const AuthSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData } = useSlack();
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (hasProcessed) return; // Prevent multiple executions

    const teamId = searchParams.get('team_id');
    const teamName = searchParams.get('team_name');
    const userId = searchParams.get('user_id');

    if (teamId && teamName && userId) {
      setAuthData({
        teamId,
        teamName,
        userId,
        isAuthenticated: true
      });
      
      setHasProcessed(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      navigate('/auth-error?error=missing_data');
    }
  }, []); // Remove dependencies to run only once

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-lg font-medium text-gray-900">
              Successfully Connected to Slack!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Redirecting you to the dashboard...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;
