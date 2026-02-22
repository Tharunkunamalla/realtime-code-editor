FROM ghcr.io/engineer-man/piston:latest

# Install common languages during build (Add/Remove as needed)
# Format: <language> <version>
RUN /piston/packages/run-install.sh nodejs 18.15.0
RUN /piston/packages/run-install.sh python 3.10.0
RUN /piston/packages/run-install.sh java 15.0.2

EXPOSE 2000