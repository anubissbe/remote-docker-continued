# Security Policy

## Supported Versions

We actively support the latest version of Remote Docker extension. Security updates are provided for:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The Remote Docker team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

1. **Do not** open a public GitHub issue for security vulnerabilities
2. **Do** send a detailed report to the repository owner via:
   - GitHub Security Advisories (preferred)
   - Direct message to [@anubissbe](https://github.com/anubissbe)

### What to Include

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Suggested fix (if you have one)
- Your contact information for follow-up

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Assessment**: We will assess the vulnerability and determine its severity within 5 business days
- **Updates**: We will provide regular updates on our progress
- **Resolution**: We aim to resolve high-severity issues within 30 days
- **Disclosure**: We will coordinate with you on public disclosure timing

### Security Best Practices

When using Remote Docker:

1. **SSH Keys**: 
   - Use strong SSH key pairing (RSA 4096-bit or Ed25519)
   - Protect your private keys with strong passphrases
   - Regularly rotate SSH keys

2. **Remote Hosts**:
   - Keep Docker and SSH daemon updated
   - Use firewall rules to restrict SSH access
   - Monitor SSH access logs

3. **Network Security**:
   - Use VPN when connecting over public networks
   - Consider port forwarding instead of direct SSH exposure

4. **Extension Updates**:
   - Keep the extension updated to the latest version
   - Review release notes for security fixes

### Known Security Considerations

- SSH keys are mounted read-only into the extension container
- No SSH keys are included in Docker images
- All remote communication goes through SSH tunnels
- Extension requires Docker Desktop's security model

### Dependencies

We use automated tools to monitor dependencies:

- **Dependabot**: Automatically creates PRs for dependency updates
- **Security Scanning**: Regular scans using Trivy and other tools
- **Audit Checks**: npm audit and Go vulnerability checks in CI/CD

For questions about this policy, please contact [@anubissbe](https://github.com/anubissbe).