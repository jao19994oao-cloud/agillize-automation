SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
ORDER BY 
    table_name, ordinal_position;

UPDATE app_license 
SET status = 'BLOCKED';

curl -X POST http://localhost:3000/api/financial/webhook/asaas -H "Content-Type: application/json" -d "{\"event\": \"PAYMENT_RECEIVED\", \"payment\": { \"id\": \"pay$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjhmOWI4YzZiLTUwNTctNDA4OS05MGViLTY0MmI5MGIxYWEzMTo6JGFhY2hfMjA4MmRjNTUtY2ZjZC00MjBkLWFlNzYtYzZjZDM3OWI4N2Ex\" }}"