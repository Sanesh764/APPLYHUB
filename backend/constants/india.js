const countryService = require("../services/country.service");

// Re-export constants for backward compatibility
const INDIAN_CITIES = countryService.getCountryData("India").cities;
const INDIAN_STATES = countryService.getCountryData("India").states;

const INTERNSHIP_TYPES = [
  "Software Development Internship",
  "Frontend Internship",
  "Backend Internship",
  "Full Stack Internship",
  "AI/ML Internship",
  "Data Science Internship",
  "DevOps Internship",
  "Cloud Internship",
  "Cyber Security Internship",
  "UI/UX Internship",
  "Mobile App Internship",
  "Product Internship",
  "QA Internship",
];

function isIndianLocation(location) {
  return countryService.isCountryLocation(location, "India");
}

function isRemoteLocation(location) {
  return countryService.isRemoteLocation(location);
}

function allowsIndiaApplicants(job) {
  return countryService.allowsCountryApplicants(job, "India");
}

function indiaTier(job) {
  return countryService.countryTier(job, "India");
}

module.exports = {
  INDIAN_CITIES,
  INDIAN_STATES,
  INTERNSHIP_TYPES,
  isIndianLocation,
  isRemoteLocation,
  allowsIndiaApplicants,
  indiaTier,
};
