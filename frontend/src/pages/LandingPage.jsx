import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedEvents from '../components/FeaturedEvents';
import About from '../components/About';
import Categories from '../components/Categories';
import Statistics from '../components/Statistics';
import Gallery from '../components/Gallery';
import Schedule from '../components/Schedule';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturedEvents />
        <About />
        <Categories />
        <Statistics />
        <Gallery />
        <Schedule />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
