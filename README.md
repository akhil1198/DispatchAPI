# DispatchAPI

A serverless backend API for a corporate ride booking system, built with Azure Functions, Node.js, and PostgreSQL.

## Overview

This project provides a complete backend solution for corporate transportation management. Employees can book rides with company-owned vehicles for work trips, similar to Uber but for internal corporate use.

Key features:
- Employee management and authentication
- Driver and vehicle management
- Ride booking, assignment, and tracking
- Admin controls for fleet management

## Architecture

- **Backend**: Node.js on Azure Functions (serverless)
- **Database**: PostgreSQL on Azure Database for PostgreSQL
- **Authentication**: JWT-based auth system
- **API**: RESTful endpoints for all operations

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new employee
- `POST /api/auth/login` - Authenticate an employee

### Employees
- `GET /api/employees` - List all employees (admin only)
- `GET /api/employees/{id}` - Get employee details
- `POST /api/employees` - Create an employee (admin only)
- `PUT /api/employees/{id}` - Update employee details
- `DELETE /api/employees/{id}` - Delete an employee (admin only)

### Drivers
- `GET /api/drivers` - List all drivers
- `GET /api/drivers/{id}` - Get driver details
- `POST /api/drivers` - Create a driver (admin only)
- `PUT /api/drivers/{id}` - Update driver details
- `DELETE /api/drivers/{id}` - Delete a driver (admin only)

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `GET /api/vehicles/{id}` - Get vehicle details
- `POST /api/vehicles` - Add a vehicle (admin only)
- `PUT /api/vehicles/{id}` - Update vehicle details
- `DELETE /api/vehicles/{id}` - Delete a vehicle (admin only)

### Rides
- `GET /api/rides` - List rides (admins see all, employees see own)
- `GET /api/rides/{id}` - Get ride details
- `POST /api/rides` - Book a new ride
- `POST /api/rides/assign` - Assign driver/vehicle to ride (admin only)
- `PUT /api/rides/{id}` - Update ride status
- `PUT /api/rides/{id}/cancel` - Cancel a ride

## Local Development

### Prerequisites
- Node.js 16+
- Azure Functions Core Tools v4
- PostgreSQL database

## Deployment

This API is deployed to Azure Functions.
