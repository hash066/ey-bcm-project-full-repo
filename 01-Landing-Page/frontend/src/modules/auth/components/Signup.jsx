import React from 'react';
import { Link } from 'react-router-dom';

const Signup = () => {
  return (
  <div className = "auth-page">
    <div className="auth-container">
      <h2>Create a New Account</h2>
      <form className="auth-form">
        <label>Full Name</label>
        <input type="text" placeholder="Enter your full name" required />

        <label>Email</label>
        <input type="email" placeholder="Enter your email" required />

        <label>Password</label>
        <input type="password" placeholder="Create a password" required />

        <label htmlFor="role">Role</label>
            <select id="role" name="role" required>
            <option value="" disabled selected>Select your role</option>
            <option value="department_head">Department Head</option>
            <option value="manager">Manager</option>
            <option value="bcm_coordinator">BCM Coordinator</option>
            <option value="cia">CIA</option>
        </select>


        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <Link to="/">Login</Link></p>
    </div>

    </div>
  );
};

export default Signup;