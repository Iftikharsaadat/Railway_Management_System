import { Link } from "react-router-dom";
import trainImage from "../assets/train.jpg";

function Home() {
  return (
    <div className="home-page">

      {/* Navbar */}
      <nav className="navbar">

        <div className="logo">
          🚆 Railway<span>Booking</span>
        </div>

        {/* <div className="nav-buttons">
          <Link to="/login" className="nav-login">
            Login
          </Link>

          <Link to="/signup" className="nav-signup">
            Sign Up
          </Link>
        </div> */}

      </nav>


      {/* Hero Section */}
      <section className="hero">

        <div className="hero-content">

          <p className="hero-small-title">
            YOUR JOURNEY STARTS HERE
          </p>

          <h1>
            Travel smarter.
            <br />
            <span>Travel by train.</span>
          </h1>

          <p className="hero-description">
            Book your train tickets easily, find your preferred
            journey and travel comfortably across Bangladesh.
          </p>

          <div className="hero-buttons">

            <Link to="/login" className="primary-button">
              Login to Book
            </Link>

            <Link to="/signup" className="secondary-button">
              Create Account
            </Link>

          </div>

        </div>


        {/* Train Image */}
        <div className="hero-image-container">

          <img
            src={trainImage}
            alt="Train"
            className="hero-train-image"
          />

        </div>

      </section>


      {/* Features */}
      <section className="features">

        <div className="feature-card">
          <div className="feature-icon">🎫</div>
          <h3>Easy Booking</h3>
          <p>
            Book your train ticket quickly and easily.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🚆</div>
          <h3>Find Your Train</h3>
          <p>
            Search available trains and routes easily.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Secure Account</h3>
          <p>
            Your account and booking information stays protected.
          </p>
        </div>

      </section>


      {/* Footer */}
      <footer className="home-footer">
        <p>Devloped by Ifti & Taqi</p>
      </footer>

    </div>
  );
}

export default Home;