#!/bin/sh
# vim:sw=4:ts=4:et

set -e

entrypoint_log() {
    if [ -z "${QUANTNET_ENTRYPOINT_QUIET_LOGS:-}" ]; then
        echo "$@"
    fi
}

if [ -n "${QUANTNET_ENTRYPOINT_DELAY:-}" ]; then
	entrypoint_log "$0: Wait for ${QUANTNET_ENTRYPOINT_DELAY} seconds to start..."
	sleep ${QUANTNET_ENTRYPOINT_DELAY}
fi

exec "$@"
