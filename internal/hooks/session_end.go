package hooks

// RunSessionEnd handles SessionEnd hook to show capture tips
func RunSessionEnd() {
	// No need to read stdin for SessionEnd, just show tips
	// But we should still read it to avoid broken pipe
	_, _ = ReadStdin()

	// Show capture tips via stderr (no additionalContext needed since session is ending)
	WriteStderr("[autology] To capture this session's insights in your knowledge graph:")
	WriteStderr("[autology]   1. Resume session: claude -r")
	WriteStderr("[autology]   2. Run: /autology:capture")
}
