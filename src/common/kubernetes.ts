
/**
 * Get kubernetes resource name (service) from userId and function name.
 * Normalized to fit as app, deployment and service name in kubernets:
 * Error from server (Invalid): error when creating "/var/folders/f6/nw_94s0n3wx5hc422cdf0s500000gn/T/5fc50dbe": Deployment.apps ".nste.gg-useragent-app" is invalid: [metadata.name: Invalid value: ".nste.gg-useragent-app": a lowercase RFC 1123 subdomain must consist of lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character (e.g. 'example.com', regex used for validation is '[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*'), spec.selector.matchLabels: Invalid value: ".nste.gg-useragent-app": a valid label must be an empty string or consist of alphanumeric characters, '-', '_' or '.', and must start and end with an alphanumeric character (e.g. 'MyValue',  or 'my_value',  or '12345', regex used for validation is '(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?'), spec.selector: Invalid value: v1.LabelSelector{MatchLabels:map[string]string{"app":".nste.gg-useragent-app"}, MatchExpressions:[]v1.LabelSelectorRequirement(nil)}: invalid label selector]
 * Error from server (Invalid): error when creating "/var/folders/f6/nw_94s0n3wx5hc422cdf0s500000gn/T/5fc50dbe": Service ".nste.gg-useragent-service" is invalid: [metadata.name: Invalid value: ".nste.gg-useragent-service": a DNS-1035 label must consist of lower case alphanumeric characters or '-', start with an alphabetic character, and end with an alphanumeric character (e.g. 'my-name',  or 'abc-123', regex used for validation is '[a-z]([-a-z0-9]*[a-z0-9])?'), spec.selector: Invalid value: ".nste.gg-useragent-app": a valid label must be an empty string or consist of alphanumeric characters, '-', '_' or '.', and must start and end with an alphanumeric character (e.g. 'MyValue',  or 'my_value',  or '12345', regex used for validation is '(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?')]
 * Error from server (Invalid): error when creating "/var/folders/f6/nw_94s0n3wx5hc422cdf0s500000gn/T/5fc50dbe": HorizontalPodAutoscaler.autoscaling ".nste.gg-useragent-scaler" is invalid: metadata.name: Invalid value: ".nste.gg-useragent-scaler": a lowercase RFC 1123 subdomain must consist of lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character (e.g. 'example.com', regex used for validation is '[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*')
 * @param userId 
 * @param funcName 
 * @returns 
 */
export function getKubernetesResourceName(userId: string, funcName: string): string {
    const normalizedUserId = userId.replaceAll(/([A-Z])/g, '-$1').toLowerCase();
    const name = 'client-' +  normalizedUserId + '-' + funcName;
    return name;
}