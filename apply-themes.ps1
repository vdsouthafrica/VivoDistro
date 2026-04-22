$excluded = @('index.html', 'login.html', 'signup.html', 'create-password.html', 'email-confirmed.html', 'role-redirect.html')
$hubFiles = @('agent-hub.html', 'booker-hub.html', 'performer-hub.html')

$snippet = @"
    <!-- GLobally Applied Theme Hook -->
    <link rel="stylesheet" href="settings.css">
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const configT = localStorage.getItem('vivo_theme') || 'theme-default';
            if(configT !== 'theme-default') document.body.classList.add(configT);
        });
    </script>
</head>
"@

Get-ChildItem -Filter *.html | ForEach-Object {
    $name = $_.Name
    if ($excluded -notcontains $name -and $hubFiles -notcontains $name) {
        $content = Get-Content $_.FullName -Raw
        if ($content -notmatch 'settings\.css') {
            $content = $content -replace '</head>', $snippet
            Set-Content $_.FullName $content
            Write-Host "Updated $name"
        }
    }
}
