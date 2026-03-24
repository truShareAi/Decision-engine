-- Create Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100)
);

-- Create Deals Table
CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    affiliate_link TEXT,
    source VARCHAR(100),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Mock Data for Testing
INSERT INTO products (name, category, brand) VALUES 
('Comprehensive Car Insurance', 'car-insurance', 'Direct Line'),
('Home Emergency Cover', 'home-insurance', 'Admiral'),
('Fixed Rate Mortgage', 'mortgages', 'Banana Bank');

INSERT INTO deals (product_id, price, original_price, affiliate_link, source) VALUES 
(1, 35.00, 45.00, 'https://example.com/deal1', 'Direct Line'),
(2, 12.99, 20.00, 'https://example.com/deal2', 'Admiral'),
(3, 3.85, 4.50, 'https://example.com/deal3', 'Banana Bank');

