/**
 * Construye PopupTemplate a partir de la configuracion por capa (RF-POP-01/02/03/04).
 *  - Atributos configurables (titulos, alias, orden, formato)
 *  - Registros relacionados por relationshipId (RelationshipContent) o por join
 *    de campo llave (contenido personalizado con consulta a la capa relacionada)
 *  - Accion para abrir Google Street View
 */
import PopupTemplate from '@arcgis/core/PopupTemplate';
import FieldsContent from '@arcgis/core/popup/content/FieldsContent';
import FieldInfo from '@arcgis/core/popup/FieldInfo';
import RelationshipContent from '@arcgis/core/popup/content/RelationshipContent';
import CustomContent from '@arcgis/core/popup/content/CustomContent';
import ActionButton from '@arcgis/core/support/actions/ActionButton';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Graphic from '@arcgis/core/Graphic';
import type { AppConfig, PopupLayerConfig, PopupRelatedConfig } from '@/types/config';

/** ID de accion que dispara la apertura de Street View (manejado en el MapContainer). */
export const STREET_VIEW_ACTION_ID = 'open-street-view';

function buildFieldInfos(cfg: PopupLayerConfig): FieldInfo[] {
  return cfg.fields.map(
    (f) =>
      new FieldInfo({
        fieldName: f.name,
        label: f.label ?? f.name,
        format:
          f.format === 'number'
            ? { digitSeparator: true, places: 0 }
            : undefined,
      }),
  );
}

function buildRelatedContent(
  related: PopupRelatedConfig,
): RelationshipContent | CustomContent {
  if (related.mode === 'relationshipId' && related.relationshipId != null) {
    return new RelationshipContent({
      relationshipId: related.relationshipId,
      title: related.label,
      displayCount: 10,
    });
  }

  // Join por campo llave (RF-SRC-04 / RF-POP-02 modo 'join').
  return new CustomContent({
    outFields: ['*'],
    creator: async (event) => {
      const graphic = event?.graphic as Graphic | undefined;
      const container = document.createElement('div');
      container.className = 'sig-related-join';
      if (!graphic || !related.relatedUrl || !related.keyField || !related.targetKeyField) {
        container.textContent = 'Sin relacion configurada.';
        return container;
      }
      const keyValue = graphic.attributes?.[related.keyField];
      if (keyValue == null) {
        container.textContent = 'Sin valor de llave para relacionar.';
        return container;
      }
      const heading = document.createElement('h4');
      heading.textContent = related.label;
      container.appendChild(heading);
      try {
        const relatedLayer = new FeatureLayer({ url: related.relatedUrl });
        const result = await relatedLayer.queryFeatures({
          where: `${related.targetKeyField} = '${String(keyValue).replace(/'/g, "''")}'`,
          outFields: ['*'],
          returnGeometry: false,
          num: 25,
        });
        if (result.features.length === 0) {
          const p = document.createElement('p');
          p.textContent = 'No hay registros relacionados.';
          container.appendChild(p);
        } else {
          const ul = document.createElement('ul');
          for (const feat of result.features) {
            const li = document.createElement('li');
            li.textContent = Object.entries(feat.attributes)
              .slice(0, 4)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' · ');
            ul.appendChild(li);
          }
          container.appendChild(ul);
        }
      } catch (err) {
        container.textContent = `Error consultando relacionados: ${(err as Error).message}`;
      }
      return container;
    },
  });
}

export function buildPopupTemplate(cfg: PopupLayerConfig, appCfg: AppConfig): PopupTemplate {
  const content: (FieldsContent | RelationshipContent | CustomContent)[] = [
    new FieldsContent({ fieldInfos: buildFieldInfos(cfg) }),
  ];

  for (const rel of cfg.related ?? []) {
    content.push(buildRelatedContent(rel));
  }

  const actions: ActionButton[] = [];
  if (cfg.streetView && appCfg.streetView.enabled) {
    actions.push(
      new ActionButton({
        id: STREET_VIEW_ACTION_ID,
        title: 'Street View',
        icon: 'road-sign',
      }),
    );
  }

  return new PopupTemplate({
    title: cfg.title,
    outFields: ['*'],
    content,
    actions,
  });
}
