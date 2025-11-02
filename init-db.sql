-- Multi-App Database Initialization
-- This script creates separate databases for each application

-- Create databases for different applications
CREATE DATABASE IF NOT EXISTS gita_fashion_db;
CREATE DATABASE IF NOT EXISTS analytics_db;
CREATE DATABASE IF NOT EXISTS ecommerce_db;
CREATE DATABASE IF NOT EXISTS blog_db;

-- Create users for each application
CREATE USER IF NOT EXISTS 'gita_fashion_user'@'%' IDENTIFIED BY 'gita_fashion_password';
CREATE USER IF NOT EXISTS 'analytics_user'@'%' IDENTIFIED BY 'analytics_password';
CREATE USER IF NOT EXISTS 'ecommerce_user'@'%' IDENTIFIED BY 'ecommerce_password';
CREATE USER IF NOT EXISTS 'blog_user'@'%' IDENTIFIED BY 'blog_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON gita_fashion_db.* TO 'gita_fashion_user'@'%';
GRANT ALL PRIVILEGES ON analytics_db.* TO 'analytics_user'@'%';
GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'ecommerce_user'@'%';
GRANT ALL PRIVILEGES ON blog_db.* TO 'blog_user'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Create shared tables if needed
USE gita_fashion_db;

-- Example: Shared user sessions table
CREATE TABLE IF NOT EXISTS shared_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    app_name VARCHAR(50) NOT NULL,
    session_data TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_app_name (app_name),
    INDEX idx_expires_at (expires_at)
);

-- Example: Shared audit log table
CREATE TABLE IF NOT EXISTS shared_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    app_name VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(255),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_app_name (app_name),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);