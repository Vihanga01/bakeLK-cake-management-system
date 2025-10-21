import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const ThankYou = ({ setShowLogin }) => {
	const [params] = useSearchParams();
	const orderId = params.get('orderId');

	return (
		<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', padding: 16 }}>
			<div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 12px 30px rgba(16,185,129,0.2)', padding: 24, maxWidth: 640, width: '100%', textAlign: 'center', border: '1px solid rgba(22,163,74,0.12)' }}>
				<div style={{ fontSize: 36, fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>Thank you!</div>
				<p style={{ color: '#334155', marginBottom: 12 }}>Your Bake.lk order has been received.</p>
				{orderId && <p style={{ color: '#64748b', fontSize: 14, marginBottom: 18 }}>Order ID: <b>{orderId}</b></p>}
				<p style={{ color: '#64748b', fontSize: 14 }}>We’ll send a confirmation email shortly. For Bank Transfers, we’ll verify your receipt and update your order status.</p>
				<div style={{ marginTop: 20 }}>
					<Link to="/products" style={{ display: 'inline-block', background: 'linear-gradient(90deg,#16a34a,#34d399)', color: '#fff', padding: '10px 16px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 8px 18px rgba(52,211,153,0.3)' }}>Continue Shopping</Link>
				</div>
			</div>
		</div>
	);
};

export default ThankYou;


