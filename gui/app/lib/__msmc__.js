main.emit('msmc', 'select_account', console.log) // Opens MS Login window, third parameter is called on success
main.emit('msmc', 'none', console.log) // Should silently return an access token
main.emit('msmc', '', console.log) // If already logged in returns only acces token and profile, if not logged in prompts to login
