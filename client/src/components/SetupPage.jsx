import { useState } from 'react';

export default function SetupPage({ onConfigured }) {
    const [token, setToken] = useState('');
    const [mongoUri, setMongoUri] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5001/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, mongoUri }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            onConfigured();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="setup-form">
            <h2>Initial Setup</h2>
            <p>Provide your credentials to connect to Microsoft Graph and MongoDB.</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Microsoft Graph API Access Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="MongoDB Connection String (e.g., mongodb://...)"
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>{loading ? 'Connecting...' : 'Connect'}</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}