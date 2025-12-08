# Minimal runtime image using pre-compiled binary
# Using debian-slim for glibc compatibility (binary was compiled on Ubuntu)
FROM debian:bookworm-slim

# Install only runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreadline8 && \
    rm -rf /var/lib/apt/lists/* && \
    # Create non-root user
    useradd -m -u 1000 shelluser && \
    # Create minimal filesystem structure
    mkdir -p /home/shelluser/workspace && \
    chown -R shelluser:shelluser /home/shelluser

# Copy pre-compiled binary
COPY minishell /usr/local/bin/minishell
RUN chmod +x /usr/local/bin/minishell

# Switch to non-root user
USER shelluser
WORKDIR /home/shelluser/workspace

# Set up minimal environment
ENV PATH=/usr/local/bin:/usr/bin:/bin \
    HOME=/home/shelluser \
    USER=shelluser \
    SHELL=/usr/local/bin/minishell \
    PWD=/home/shelluser/workspace \
    TERM=xterm-256color \
    LANG=C.UTF-8

# Run minishell by default
CMD ["/usr/local/bin/minishell"]
