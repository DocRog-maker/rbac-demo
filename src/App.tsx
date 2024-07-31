import WebViewer from '@pdftron/webviewer';
import { useEffect, useRef } from 'react';
import './App.css';

function App() {
  const viewerDiv = useRef<HTMLDivElement>(null);

  // A very simple method for getting the role associated with the user. In practice you would get this from
  // Some kind of authentication system.
  const getRole = (name: string) => {
    if (name.toLowerCase() == 'justin') return 'admin';
    if (name.toLowerCase() == 'sally') return 'regular-user'
    if (name.toLowerCase() == 'brian') return 'read-only-user'
    return 'unknown'
  }

  useEffect(() => {
    WebViewer({
      licenseKey: '[Your license key]',
      path: 'lib',
      enableFilePicker: true,
      fullAPI: true //Needed to lookup PDF metadata
    }, viewerDiv.current as HTMLDivElement).then((instance) => {
      const { UI, Core } = instance;
      const { documentViewer, annotationManager } = Core;

      const input = document.getElementById('user_name') as HTMLInputElement;
      const button = document.getElementById('set_user_name') as HTMLButtonElement;
      if (input && button) {
        button.addEventListener('click', async () => {
          // Get the file from the input
          if (input.value) {
            const user = input.value
            annotationManager.setCurrentUser(user)

            // Need fullApi for this
            const pdfDoc = await documentViewer.getDocument().getPDFDoc()
            const pdfDocInfo = await pdfDoc.getDocInfo();
            const docAuthor = await pdfDocInfo.getAuthor();

            // Get the role for the user.
            // However, if the user is the document author then that gives them special prvileges
            const role = (user==docAuthor)? 'author': getRole(user);

            //Set defaults - which will be over-ridden for specific users
            //Show all of the annotations, then hide those for a specific user
            const allAnnots = annotationManager.getAnnotationsList();
            annotationManager.showAnnotations(allAnnots);
            UI.setTheme(UI.Theme.LIGHT);
            UI.enableElements(['viewControlsButton','selectToolButton']);

            //Set rules depending on the role
            if (role == 'author') {
              console.log('author')
              annotationManager.promoteUserToAdmin()
              annotationManager.disableReadOnlyMode();
              UI.setTheme(UI.Theme.DARK);
            }
            else if (role == 'admin' ) {
              console.log('admin')
              annotationManager.promoteUserToAdmin()
              annotationManager.disableReadOnlyMode();
            }
            else if (role == "regular-user") {
              console.log('user')
              annotationManager.demoteUserFromAdmin();
              annotationManager.disableReadOnlyMode();
              const hideList = allAnnots.filter(annot => {
                return annot instanceof Core.Annotations.TextUnderlineAnnotation;
              });
              annotationManager.hideAnnotations(hideList);
            }
            else if (role == "read-only-user") {
              console.log('readonly')
              annotationManager.enableReadOnlyMode();
              const hideList = allAnnots.filter(annot => {
                return annot instanceof Core.Annotations.FreeHandAnnotation;
              });
              annotationManager.hideAnnotations(hideList);
            }
            else {
              console.log('unknown')
              annotationManager.enableReadOnlyMode();
              const hideList = allAnnots.filter(annot => {
                return annot instanceof Core.Annotations.FreeHandAnnotation;
              });
              annotationManager.hideAnnotations(hideList);
              UI.disableElements(['viewControlsButton', 'selectToolButton']);
            }
          }
        });
      }
    });
  }, [])


  return (
    <>
      <button id='set_user_name' type="button">Set user</button>
      <input type="text" id="user_name" name="user_name" />
      <button id='get_diags' type="button">Get Diagnostics</button>
      <div className='webviewer' ref={viewerDiv}></div>
    </>
  )
}

export default App
