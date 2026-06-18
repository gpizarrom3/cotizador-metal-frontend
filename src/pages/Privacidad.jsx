import { Link } from 'react-router-dom'

const FECHA = '1 de junio de 2026'

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-3xl mx-auto px-6 py-12">

        <div className="mb-8">
          <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm">← Volver al inicio</Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidad</h1>
        <p className="text-slate-500 text-sm mb-10">Última actualización: {FECHA}</p>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de datos personales recabados a través de CotizaMetal es el operador del servicio, contactable en{' '}
              <a href="mailto:gpizarrom.3@gmail.com" className="text-blue-400 hover:text-blue-300">gpizarrom.3@gmail.com</a>.
            </p>
            <p className="mt-2">
              Esta política se rige por la legislación chilena vigente en materia de protección de datos, incluyendo la Ley N° 19.628 sobre Protección de la Vida Privada y la Ley N° 21.719 Marco sobre Ciberseguridad.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Datos que recopilamos</h2>
            <p>Al usar CotizaMetal, podemos recopilar los siguientes datos:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-slate-200">Datos de cuenta:</strong> nombre completo, correo electrónico y contraseña (almacenada de forma cifrada mediante Firebase Authentication).</li>
              <li><strong className="text-slate-200">Datos de empresa:</strong> razón social, RUT, giro, dirección, teléfono, correo comercial y logotipo, ingresados voluntariamente en la sección Configuración.</li>
              <li><strong className="text-slate-200">Datos comerciales:</strong> cotizaciones, clientes, catálogos de materiales y servicios ingresados por el usuario.</li>
              <li><strong className="text-slate-200">Datos de uso:</strong> registros de acceso, funciones utilizadas y contadores de uso (para gestión de planes).</li>
              <li><strong className="text-slate-200">Datos de pago:</strong> procesados directamente por MercadoPago. CotizaMetal no almacena números de tarjeta ni datos bancarios.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Finalidad del tratamiento</h2>
            <p>Los datos recopilados se utilizan exclusivamente para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Proveer, mantener y mejorar el servicio de CotizaMetal.</li>
              <li>Gestionar la cuenta del usuario y su suscripción.</li>
              <li>Generar documentos PDF con los datos de la empresa del usuario.</li>
              <li>Controlar el uso de funcionalidades con límite según plan.</li>
              <li>Enviar comunicaciones relacionadas con el servicio (cambios, actualizaciones).</li>
            </ul>
            <p className="mt-2 text-slate-400">
              No utilizamos los datos para publicidad de terceros ni los cedemos a empresas de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Terceros que acceden a los datos</h2>
            <p>Para operar el servicio, CotizaMetal utiliza los siguientes proveedores:</p>
            <div className="mt-3 space-y-3">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-200 font-medium">Firebase / Google Cloud</p>
                <p className="text-slate-400 mt-0.5">Autenticación de usuarios y base de datos (Firestore). Datos almacenados en servidores de Google con cifrado en tránsito y en reposo.</p>
                <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs mt-1 inline-block">Política de privacidad de Firebase →</a>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-200 font-medium">Anthropic</p>
                <p className="text-slate-400 mt-0.5">Proveedor de inteligencia artificial para la búsqueda de materiales. Solo se envía el texto de la búsqueda, sin datos personales del usuario.</p>
                <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs mt-1 inline-block">Política de privacidad de Anthropic →</a>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-200 font-medium">MercadoPago</p>
                <p className="text-slate-400 mt-0.5">Procesamiento de pagos y suscripciones. Los datos de tarjeta son manejados directamente por MercadoPago y nunca pasan por los servidores de CotizaMetal.</p>
                <a href="https://www.mercadopago.cl/privacidad" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs mt-1 inline-block">Política de privacidad de MercadoPago →</a>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-200 font-medium">Vercel</p>
                <p className="text-slate-400 mt-0.5">Plataforma de hosting y ejecución de funciones serverless. Procesa las solicitudes de la aplicación.</p>
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs mt-1 inline-block">Política de privacidad de Vercel →</a>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Derechos del usuario</h2>
            <p>De acuerdo con la legislación chilena vigente, el usuario tiene derecho a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-slate-200">Acceso:</strong> solicitar qué datos personales tenemos sobre usted.</li>
              <li><strong className="text-slate-200">Rectificación:</strong> corregir datos inexactos o desactualizados.</li>
              <li><strong className="text-slate-200">Eliminación:</strong> solicitar la eliminación de su cuenta y todos sus datos asociados.</li>
              <li><strong className="text-slate-200">Portabilidad:</strong> solicitar una copia de sus datos en formato legible.</li>
              <li><strong className="text-slate-200">Oposición:</strong> oponerse al tratamiento de sus datos para determinadas finalidades.</li>
            </ul>
            <p className="mt-2">
              Para ejercer cualquiera de estos derechos, escriba a{' '}
              <a href="mailto:gpizarrom.3@gmail.com" className="text-blue-400 hover:text-blue-300">gpizarrom.3@gmail.com</a>{' '}
              indicando su solicitud. Responderemos en un plazo máximo de 15 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Retención de datos</h2>
            <p>
              Los datos del usuario se conservan mientras la cuenta esté activa. Al eliminar la cuenta, los datos son borrados de forma permanente en un plazo de 30 días, salvo obligación legal de conservación.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger los datos del usuario, incluyendo cifrado de comunicaciones (HTTPS), autenticación segura mediante Firebase y reglas de acceso a nivel de base de datos que impiden que un usuario acceda a los datos de otro.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente. Ante cambios sustanciales, notificaremos al usuario por correo electrónico. El uso continuado del servicio tras la notificación implica la aceptación de los cambios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con esta política o el tratamiento de sus datos:{' '}
              <a href="mailto:gpizarrom.3@gmail.com" className="text-blue-400 hover:text-blue-300">gpizarrom.3@gmail.com</a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex gap-4 text-sm">
          <Link to="/terminos" className="text-blue-400 hover:text-blue-300">Términos y Condiciones</Link>
          <Link to="/login" className="text-slate-500 hover:text-slate-300">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
