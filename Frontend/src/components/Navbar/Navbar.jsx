// eslint-disable-next-line no-unused-vars
import React, { useContext, useState } from 'react'
import './Navbar.css'
import {assets} from '../../assets/frontend_assets/assets'
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
// eslint-disable-next-line react/prop-types
const Navbar = ({setShowLogin}) => {

    const [menu,setMenu]=useState("home");

    
    const [info,setInfo] = useState(false);

    const handleClick = () => {
      setInfo(!info); // Toggle between true/false
    };

    const { cartItems, isAuthenticated, logout: logoutUser, user, isLoadingUser } = useContext(StoreContext);
    const navigate = useNavigate();

    const logout = () =>{
      logoutUser();
      navigate("/");
    }


  return (
    <div className='navbar'>
      <Link to='/'><img src={assets.logo} alt="" /></Link>
      <ul className='navbar-menu'>
        <Link to='/' onClick={()=>{ setMenu("home")}} className={menu==="home"?"active":""}>home</Link>
        {user?.role !== 'admin' && <>
        <Link to='/products' onClick={()=>{ setMenu("menu")}} className={menu==="menu"?"active":""}>menu</Link>
        <Link to='/wallet' onClick={()=>{ setMenu("wallet")}} className={menu==="wallet"?"active":""}>wallet</Link>
        {isAuthenticated && <Link to='/profile' onClick={()=>{ setMenu("profile")}} className={menu==="profile"?"active":""}>profile</Link>}
        </>}
        <a href='#footer' onClick={()=>{ setMenu("contact-us")}} className={menu==="contact-us"?"active":""}>contact us</a>
      </ul>
      <div className="navbar-right">
        <div className="navbar-search-icon">
          <Link to='/cart' ><img src={assets.basket_icon} alt="" /> </Link>
          <div className={cartItems.length === 0 ? "" : "dot"}></div>
        </div>
        {!isAuthenticated ? <button className='btn' onClick={()=>{setShowLogin(true)}} >sign  in </button> : <div onClick={handleClick} className={`navbar-profile ${info ? 'profile-active' : ''}`} >
          <img src={assets.profile_icon} alt="" />
          <span className="user-name">
            {isLoadingUser ? 'Loading...' : (user?.name || user?.username || user?.email || 'User')}
          </span>
          <ul className="nav-profile-dropdown">
            <li onClick={()=>navigate('/profile')} ><img src={assets.profile_icon} alt="" /><p>Profile</p></li>
            <li onClick={()=>navigate('/myorders')} ><img src={assets.bag_icon} alt="" /><p>Orders</p></li>
            <hr />
            <li onClick={logout} ><img src={assets.logout_icon} alt="" /><p>Logout</p></li>
          </ul>
          </div>}
        
      </div>
    </div>
  )
}

export default Navbar
