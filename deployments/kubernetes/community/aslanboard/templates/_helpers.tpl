{{- define "aslanboard.labels" -}}
app.kubernetes.io/name: aslanboard
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}
{{- define "aslanboard.envFrom" -}}
envFrom:
  - configMapRef:
      name: aslanboard-config
  - secretRef:
      name: {{ .Values.existingSecret }}
{{- end -}}
{{- define "aslanboard.resources" -}}
resources:
  requests:
    cpu: {{ .Values.resources.requests.cpu }}
    memory: {{ .Values.resources.requests.memory }}
  limits:
    memory: {{ .Values.resources.limits.memory }}
{{- end -}}
