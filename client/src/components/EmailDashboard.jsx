import { useEffect, useState } from 'react';
import EmailModal from './EmailModal';

export default function EmailDashboard() {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEmailId, setSelectedEmailId] = useState(null);
    const [checkedEmails, setCheckedEmails] = useState(new Set());
    const [backingUp, setBackingUp] = useState(false);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5001/api/emails');
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setEmails(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, []);

    const handleCheckboxChange = (emailId) => {
        const newChecked = new Set(checkedEmails);
        if (newChecked.has(emailId)) {
            newChecked.delete(emailId);
        } else {
            newChecked.add(emailId);
        }
        setCheckedEmails(newChecked);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allEmailIds = emails.map(email => email.id);
            setCheckedEmails(new Set(allEmailIds));
        } else {
            setCheckedEmails(new Set());
        }
    };

    const handleBackup = async (emailIds) => {
        setBackingUp(true);
        try {
            await fetch('http://localhost:5001/api/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailIds }),
            });
            // Refresh list and clear selections
            fetchEmails();
            setCheckedEmails(new Set());
        } catch (err) {
            setError('Backup failed: ' + err.message);
        } finally {
            setBackingUp(false);
        }
    };

    if (loading) return <p>Loading emails...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div className="dashboard">
            <h2>Emails with Attachments</h2>
            <button onClick={() => handleBackup(Array.from(checkedEmails))} disabled={backingUp || checkedEmails.size === 0}>
                {backingUp ? 'Backing Up...' : `Backup Selected (${checkedEmails.size})`}
            </button>
            <table className="email-table">
                <thead>
                    <tr>
                        <th><input type="checkbox" onChange={handleSelectAll} /></th>
                        <th>#</th>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Backed Up</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {emails.map(email => (
                        <tr key={email.id}>
                            <td><input type="checkbox" checked={checkedEmails.has(email.id)} onChange={() => handleCheckboxChange(email.id)} /></td>
                            <td>{email['#']}</td>
                            <td className="email-title" onClick={() => email.BackedUp && setSelectedEmailId(email.id)}>
                                {email.Title}
                            </td>
                            <td>{new Date(email.Date).toLocaleDateString()}</td>
                            <td className={email.BackedUp ? 'backed-up-true' : 'backed-up-false'}>
                                {email.BackedUp ? 'Yes' : 'No'}
                            </td>
                            <td>
                                {!email.BackedUp && (
                                    <button onClick={() => handleBackup([email.id])} disabled={backingUp}>
                                        Backup
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {selectedEmailId && <EmailModal emailId={selectedEmailId} onClose={() => setSelectedEmailId(null)} />}
        </div>
    );
}