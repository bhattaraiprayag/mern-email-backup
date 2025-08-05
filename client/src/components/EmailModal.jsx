import { useEffect, useState } from 'react';

export default function EmailModal({ emailId, onClose }) {
    const [emailData, setEmailData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmailData = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/emails/${emailId}`);
                if (!response.ok) throw new Error('Failed to fetch email details.');
                const data = await response.json();
                setEmailData(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmailData();
    }, [emailId]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {loading ? <p>Loading email...</p> : !emailData ? <p>Could not load email.</p> : (
                    <>
                        <h2>{emailData.subject}</h2>
                        <p><strong>From:</strong> {emailData.from.emailAddress.name} ({emailData.from.emailAddress.address})</p>
                        <p><strong>Received:</strong> {new Date(emailData.receivedDateTime).toLocaleString()}</p>

                        <div className="modal-attachments">
                            <h3>Attachments ({emailData.attachments.length})</h3>
                            {emailData.attachments.length > 0 ? (
                                <ul>
                                    {emailData.attachments.map(att => <li key={att.name}>{att.name} ({Math.round(att.size / 1024)} KB)</li>)}
                                </ul>
                            ) : <p>No attachments found in backup.</p>}
                        </div>

                        <h3>Email Body</h3>
                        {/* CAUTION: This is safe here because we trust the source (our own Outlook). 
                            In a general-purpose app, this HTML should be sanitized to prevent XSS attacks. */}
                        <div className="modal-body" dangerouslySetInnerHTML={{ __html: emailData.body.content }} />

                        <button onClick={onClose} style={{ marginTop: '1rem' }}>Close</button>
                    </>
                )}
            </div>
        </div>
    );
}