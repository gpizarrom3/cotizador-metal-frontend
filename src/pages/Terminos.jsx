import { Link } from 'react-router-dom'

const FECHA = '1 de junio de 2026'

export default function Terminos() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-3xl mx-auto px-6 py-12">

        <div className="mb-8">
          <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm">← Volver al inicio</Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Términos y Condiciones</h1>
        <p className="text-slate-500 text-sm mb-10">Última actualización: {FECHA}</p>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Descripción del servicio</h2>
            <p>
              CotizaMetal es una aplicación web de cotización para la industria metalmecánica, que permite a sus usuarios crear, gestionar y exportar cotizaciones de trabajos metalmecánicos, administrar catálogos de materiales y servicios, y llevar un historial de clientes.
            </p>
            <p className="mt-2">
              El servicio es operado de forma independiente y está dirigido a empresas y profesionales del rubro metalmecánico en Chile.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Aceptación de los términos</h2>
            <p>
              Al crear una cuenta o utilizar CotizaMetal, el usuario declara haber leído, comprendido y aceptado íntegramente estos Términos y Condiciones. Si no está de acuerdo con alguno de los términos, debe abstenerse de usar el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Cuenta de usuario</h2>
            <p>Para utilizar CotizaMetal es necesario crear una cuenta con un correo electrónico válido. El usuario es responsable de:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
              <li>Todas las actividades realizadas bajo su cuenta.</li>
              <li>Notificar de inmediato ante cualquier uso no autorizado.</li>
            </ul>
            <p className="mt-2">
              CotizaMetal se reserva el derecho de suspender o eliminar cuentas que infrinjan estos términos o que sean utilizadas de forma fraudulenta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Planes y pagos</h2>
            <p>
              CotizaMetal ofrece distintos planes de suscripción con diferentes niveles de funcionalidades. Los precios y características de cada plan están disponibles en la sección de Planes dentro de la aplicación.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Los cobros se realizan de forma mensual o anual según el plan elegido.</li>
              <li>Los precios pueden modificarse con aviso previo de 30 días al usuario.</li>
              <li>El plan gratuito puede tener limitaciones en el número de cotizaciones y búsquedas con inteligencia artificial.</li>
              <li>No se realizan reembolsos por períodos parciales, salvo disposición legal en contrario.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Uso de inteligencia artificial</h2>
            <p>
              CotizaMetal incorpora funcionalidades de búsqueda asistida por inteligencia artificial (IA) para la búsqueda de materiales y precios de referencia. El usuario comprende y acepta que:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Los resultados generados por la IA son <strong className="text-slate-200">referenciales</strong> y no constituyen precios oficiales ni garantizados.</li>
              <li>CotizaMetal no se responsabiliza por decisiones comerciales tomadas en base a los resultados de la IA.</li>
              <li>El uso de la IA está sujeto a límites según el plan contratado.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Propiedad de los datos</h2>
            <p>
              Todos los datos ingresados por el usuario (cotizaciones, clientes, catálogos, configuración de empresa) son de propiedad exclusiva del usuario. CotizaMetal no cede ni vende estos datos a terceros.
            </p>
            <p className="mt-2">
              El usuario puede solicitar la exportación o eliminación de sus datos en cualquier momento, escribiendo a <a href="mailto:gpizarrom.3@gmail.com" className="text-blue-400 hover:text-blue-300">gpizarrom.3@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Limitación de responsabilidad</h2>
            <p>
              CotizaMetal se provee "tal como está". El servicio no garantiza disponibilidad ininterrumpida ni ausencia de errores. En ningún caso CotizaMetal será responsable por pérdidas de datos, lucro cesante o daños indirectos derivados del uso o imposibilidad de uso del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Modificaciones al servicio</h2>
            <p>
              CotizaMetal se reserva el derecho de modificar, suspender o discontinuar cualquier funcionalidad del servicio, con o sin previo aviso. Ante cambios sustanciales, se notificará al usuario por correo electrónico con un mínimo de 15 días de anticipación.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Ley aplicable</h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes de la República de Chile. Cualquier disputa derivada del uso del servicio se someterá a la jurisdicción de los tribunales ordinarios de justicia de Chile.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Contacto</h2>
            <p>
              Para consultas relacionadas con estos términos, puede contactarnos en:{' '}
              <a href="mailto:gpizarrom.3@gmail.com" className="text-blue-400 hover:text-blue-300">gpizarrom.3@gmail.com</a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex gap-4 text-sm">
          <Link to="/privacidad" className="text-blue-400 hover:text-blue-300">Política de Privacidad</Link>
          <Link to="/login" className="text-slate-500 hover:text-slate-300">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
