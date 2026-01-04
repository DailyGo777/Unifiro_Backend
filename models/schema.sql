CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255),
    mobile_number VARCHAR(20),
    subject VARCHAR(50),
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE startup_applications (
  -- Primary Key
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Founder Information
  full_name_founder VARCHAR(255) NOT NULL,
  gender VARCHAR(50) NOT NULL,
  age INT NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  education VARCHAR(255) NOT NULL,
  
  -- Startup Basic Information
  startup_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  stage VARCHAR(100) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  challenge TEXT NOT NULL,
  
  -- Business Details
  problem TEXT NOT NULL,
  target_market TEXT NOT NULL,
  uvp TEXT NOT NULL COMMENT 'Unique Value Proposition',
  
  -- Team Information
  has_team ENUM('Yes', 'No') NOT NULL,
  team_details TEXT NULL,
  
  -- Revenue Information
  has_revenue ENUM('Yes', 'No') NOT NULL,
  mrr VARCHAR(100) NULL COMMENT 'Monthly Recurring Revenue',
  
  -- Intellectual Property
  has_ip ENUM('Yes', 'No') NOT NULL,
  
  -- Funding Information
  is_raising ENUM('Yes', 'No') NOT NULL,
  raise_amount VARCHAR(100) NULL,
  previous_funding TEXT NOT NULL,
  
  -- Vision
  long_term_vision TEXT NOT NULL,
  
  -- Pitch Deck File (stored in database)
  pitch_deck_filename VARCHAR(255) NOT NULL,
  pitch_deck_data MEDIUMBLOB NOT NULL COMMENT 'Binary file data',
  pitch_deck_size INT NOT NULL COMMENT 'File size in bytes',
  pitch_deck_mime_type VARCHAR(100) NOT NULL,
  
  -- Confirmations
  confirm_accurate BOOLEAN NOT NULL DEFAULT FALSE,
  confirm_disqualification BOOLEAN NOT NULL DEFAULT FALSE,
  confirm_contact BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_email (email),
  INDEX idx_startup_name (startup_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
