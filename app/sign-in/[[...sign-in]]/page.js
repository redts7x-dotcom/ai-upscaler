import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#000' 
    }}>
      <SignIn appearance={{ variables: { colorPrimary: '#000' } }} />
    </div>
  );
}