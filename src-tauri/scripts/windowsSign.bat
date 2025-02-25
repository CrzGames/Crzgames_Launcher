@echo off

:: Execute AzureSignTool with environment variables
binarie-sign-windows\AzureSignTool.exe sign "%1" ^
    --azure-key-vault-url "%AZURE_KEY_VAULT_URL%" ^
    --azure-key-vault-client-id "%AZURE_KEY_VAULT_APP_CLIENT_ID%" ^
    --azure-key-vault-client-secret "%AZURE_KEY_VAULT_APP_CLIENT_SECRET%" ^
    --azure-key-vault-tenant-id "%AZURE_KEY_VAULT_TENANT_ID%" ^
    --azure-key-vault-certificate "%AZURE_KEY_VAULT_CERTIFICATE_NAME%" ^
    --timestamp-rfc3161 http://timestamp.digicert.com ^
    --timestamp-digest sha512 ^
    --file-digest sha512