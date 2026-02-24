let _isInternalConfigUpdate = false;

export function beginInternalConfigUpdate() {
  _isInternalConfigUpdate = true;
}

export function endInternalConfigUpdate() {
  _isInternalConfigUpdate = false;
}

export function isInternalConfigUpdate() {
  return _isInternalConfigUpdate;
}